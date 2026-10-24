package hu.cssos.launcher;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedDispatcher;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * A CSSOS kezdőképernyő. A teljes felületet a CSSOS weboldal adja (assets/cssos),
 * ez az osztály csak „keretet” ad neki, és összeköti az igazi Androiddal (lásd Bridge).
 */
public class MainActivity extends Activity {
    private static final int REQ_MEDIA = 1;
    private static final int REQ_LOCATION = 2;

    private WebView web;
    final Updater updater = new Updater(this);
    private PermissionRequest pendingRequest;
    private String[] pendingGrant;
    private GeolocationPermissions.Callback pendingGeo;
    private String pendingGeoOrigin;
    private BroadcastReceiver packageReceiver;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // A kijelző kivágása (előlapi kamera) mögé is rajzolhatunk
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        setContentView(web);
        hideSystemBars();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setGeolocationEnabled(true);
        // A WebView a képernyőn kívüli részt is előre kirajzolja: simább animációk, kevesebb akadás
        s.setOffscreenPreRaster(true);

        web.addJavascriptInterface(new Bridge(this), "CSSOSAndroid");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // A CSSOS saját fájljai a launcherben maradnak, minden más link külső appban nyílik
                Uri url = request.getUrl();
                if ("file".equals(url.getScheme())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) {
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            // Kamera (Kamera app) és mikrofon (Diktafon)
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> {
                    List<String> res = Arrays.asList(request.getResources());
                    List<String> grant = new ArrayList<>();
                    List<String> need = new ArrayList<>();
                    if (res.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                        grant.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE);
                        need.add(Manifest.permission.CAMERA);
                    }
                    if (res.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                        grant.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE);
                        need.add(Manifest.permission.RECORD_AUDIO);
                    }
                    if (grant.isEmpty()) { request.deny(); return; }
                    List<String> missing = new ArrayList<>();
                    for (String p : need) if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) missing.add(p);
                    if (missing.isEmpty()) {
                        request.grant(grant.toArray(new String[0]));
                    } else {
                        pendingRequest = request;
                        pendingGrant = grant.toArray(new String[0]);
                        requestPermissions(missing.toArray(new String[0]), REQ_MEDIA);
                    }
                });
            }

            // Helymeghatározás (Időjárás → Helyzetem)
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, false);
                } else {
                    pendingGeoOrigin = origin;
                    pendingGeo = callback;
                    requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOCATION);
                }
            }
        });

        // Ha a telefon már letöltött egy újabb CSSOS-t a GitHubról, azt tölti be; különben a beépítettet
        web.loadUrl(updater.startUrl());

        // Ha appot telepítenek vagy eltávolítanak, frissül a kezdőképernyő
        packageReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                callJs("window.cssosAppsChanged && cssosAppsChanged()");
            }
        };
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_PACKAGE_ADDED);
        filter.addAction(Intent.ACTION_PACKAGE_REMOVED);
        filter.addAction(Intent.ACTION_PACKAGE_CHANGED);
        filter.addDataScheme("package");
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(packageReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(packageReceiver, filter);
        }

        // Vissza gomb / visszafelé húzás: a CSSOS dönti el, mit csinál (a launcherből sosem lép ki)
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                    () -> callJs("window.cssosBack && cssosBack()"));
        }
    }

    // ---------- Rendszerfrissítés ----------
    private static final int REQ_UPDATE_FILE = 10;
    private static final String APK_TYPE = "application/vnd.android.package-archive";

    /** Fájlválasztó a letöltött CSSOS.apk-hoz (Letöltések, Drive, stb.). */
    void pickUpdateFile() {
        // Előbb engedély kell ahhoz, hogy a CSSOS appot telepíthessen
        if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
            callJs("window.cssosUpdateStatus && cssosUpdateStatus('permission')");
            startActivity(new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getPackageName())));
            return;
        }
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT)
                .addCategory(Intent.CATEGORY_OPENABLE)
                .setType("*/*")
                .putExtra(Intent.EXTRA_MIME_TYPES, new String[]{APK_TYPE, "application/octet-stream"});
        try {
            startActivityForResult(i, REQ_UPDATE_FILE);
        } catch (Exception e) {
            callJs("window.cssosUpdateStatus && cssosUpdateStatus('error')");
        }
    }

    @SuppressWarnings("deprecation")
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_UPDATE_FILE) return;
        if (resultCode != RESULT_OK || data == null || data.getData() == null) {
            callJs("window.cssosUpdateStatus && cssosUpdateStatus('cancel')");
            return;
        }
        // Az Android saját telepítője: ugyanazzal a kulccsal aláírt, nagyobb verziójú APK
        // a régi fölé települ, és minden adat megmarad.
        Intent install = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(data.getData(), APK_TYPE)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            startActivity(install);
            callJs("window.cssosUpdateStatus && cssosUpdateStatus('installing')");
        } catch (Exception e) {
            callJs("window.cssosUpdateStatus && cssosUpdateStatus('error')");
        }
    }

    /** JavaScript futtatása a CSSOS-ban (bármelyik szálról hívható). */
    void callJs(String js) {
        runOnUiThread(() -> web.evaluateJavascript(js, null));
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        callJs("window.cssosBack && cssosBack()");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // A telefon Home gombja: vissza a CSSOS kezdőképernyőre
        callJs("window.cssosHome && cssosHome()");
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemBars();
        callJs("window.cssosResume && cssosResume()");
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        boolean all = grantResults.length > 0;
        for (int r : grantResults) all &= r == PackageManager.PERMISSION_GRANTED;
        if (requestCode == REQ_MEDIA && pendingRequest != null) {
            if (all) pendingRequest.grant(pendingGrant);
            else pendingRequest.deny();
            pendingRequest = null;
        } else if (requestCode == REQ_LOCATION && pendingGeo != null) {
            pendingGeo.invoke(pendingGeoOrigin, all, false);
            pendingGeo = null;
        }
    }

    @Override
    protected void onDestroy() {
        unregisterReceiver(packageReceiver);
        web.destroy();
        super.onDestroy();
    }

    /** Az Android saját felső és alsó sávját elrejtjük, mert a CSSOS-nak sajátja van. */
    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }
}
