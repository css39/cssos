package hu.cssos.launcher;

import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.AdaptiveIconDrawable;
import android.graphics.drawable.Drawable;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * Híd a CSSOS (JavaScript) és az igazi Android között.
 * A CSSOS-ban `CSSOSAndroid.metódus()` néven érhetők el ezek a függvények.
 */
public class Bridge {
    private static final int ICON_SIZE = 128;

    private final MainActivity act;
    private final PackageManager pm;

    Bridge(MainActivity act) {
        this.act = act;
        this.pm = act.getPackageManager();
    }

    /** A telefonon lévő összes elindítható app: azonosító, név és ikon (PNG, base64). */
    @JavascriptInterface
    public String getApps() {
        Intent main = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        @SuppressWarnings("deprecation")
        List<ResolveInfo> list = pm.queryIntentActivities(main, 0);
        JSONArray arr = new JSONArray();
        for (ResolveInfo ri : list) {
            String pkg = ri.activityInfo.packageName;
            if (pkg.equals(act.getPackageName())) continue;
            try {
                JSONObject o = new JSONObject();
                o.put("id", pkg + "/" + ri.activityInfo.name);
                o.put("pkg", pkg);
                o.put("label", ri.loadLabel(pm).toString());
                o.put("icon", iconToBase64(ri.loadIcon(pm)));
                arr.put(o);
            } catch (Exception ignored) {
            }
        }
        return arr.toString();
    }

    /** App indítása az azonosítója alapján ("csomag/activity"). */
    @JavascriptInterface
    public void launch(String id) {
        String[] parts = id.split("/", 2);
        if (parts.length < 2) return;
        Intent i = new Intent(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_LAUNCHER)
                .setComponent(new ComponentName(parts[0], parts[1]))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        start(i);
    }

    /** App indítása csomagnév alapján (pl. a Google Play: com.android.vending). */
    @JavascriptInterface
    public boolean launchPackage(String pkg) {
        Intent i = pm.getLaunchIntentForPackage(pkg);
        if (i == null) return false;
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        start(i);
        return true;
    }

    /** Az Android eltávolító ablakának megnyitása. */
    @JavascriptInterface
    public void uninstall(String pkg) {
        start(new Intent(Intent.ACTION_DELETE, Uri.parse("package:" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    /** Az app adatlapja az Android beállításaiban. */
    @JavascriptInterface
    public void appInfo(String pkg) {
        start(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    /** Hol lehet kiválasztani az alapértelmezett kezdőképernyőt. */
    @JavascriptInterface
    public void homeSettings() {
        Intent i = new Intent(Settings.ACTION_HOME_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (i.resolveActivity(pm) == null) i = new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        start(i);
    }

    /** Az Android saját Beállítások appja. */
    @JavascriptInterface
    public void systemSettings() {
        start(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    /** Akkumulátor: {"level": 0..1, "charging": true/false} */
    @JavascriptInterface
    public String battery() {
        BatteryManager bm = act.getSystemService(BatteryManager.class);
        if (bm == null) return "null";
        int pct = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
        return "{\"level\":" + (pct / 100.0) + ",\"charging\":" + bm.isCharging() + "}";
    }

    /** A valódi vaku (zseblámpa) be- és kikapcsolása. Igaz, ha sikerült. */
    @JavascriptInterface
    public boolean torch(boolean on) {
        CameraManager cm = act.getSystemService(CameraManager.class);
        if (cm == null) return false;
        try {
            for (String id : cm.getCameraIdList()) {
                Boolean flash = cm.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                if (Boolean.TRUE.equals(flash)) {
                    cm.setTorchMode(id, on);
                    return true;
                }
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    /** Rezgés ezredmásodpercig. */
    @JavascriptInterface
    public void vibrate(long ms) {
        Vibrator v = act.getSystemService(Vibrator.class);
        if (v != null && v.hasVibrator()) {
            v.vibrate(VibrationEffect.createOneShot(Math.max(1, ms), VibrationEffect.DEFAULT_AMPLITUDE));
        }
    }

    /** A telefon gyártója és típusa, pl. „Samsung SM-A546B”. */
    @JavascriptInterface
    public String deviceName() {
        return Build.MANUFACTURER.substring(0, 1).toUpperCase() + Build.MANUFACTURER.substring(1) + " " + Build.MODEL;
    }

    /** A telepített CSSOS-app verziója, pl. „2.0”. */
    @JavascriptInterface
    public String appVersion() {
        try {
            return pm.getPackageInfo(act.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "";
        }
    }

    // ---------- Online frissítés (GitHub) ----------

    /** A most futó CSSOS verziója (a letöltött, ha újabb, mint az appba épített). */
    @JavascriptInterface
    public String webVersion() {
        return act.updater.currentVersion();
    }

    /** Frissítés keresése; az eredmény a CSSOS-ban: cssosUpdateStatus(állapot, verzió). */
    @JavascriptInterface
    public void checkUpdate() {
        act.updater.check((state, version) ->
                act.callJs("window.cssosUpdateStatus && cssosUpdateStatus('" + state + "','" + version.replace("'", "") + "')"));
    }

    /** Újraindítás a letöltött frissítéssel. */
    @JavascriptInterface
    public void restartApp() {
        act.runOnUiThread(act::recreate);
    }

    /** Ha az Android-appot is frissíteni kell: az új CSSOS.apk letöltése a böngészőben. */
    @JavascriptInterface
    public void downloadApk() {
        start(new Intent(Intent.ACTION_VIEW, Uri.parse(Updater.BASE + "CSSOS.apk")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    /** Rendszerfrissítés: a felhasználó kiválasztja a letöltött CSSOS.apk fájlt, és az Android telepíti. */
    @JavascriptInterface
    public void pickUpdate() {
        act.runOnUiThread(act::pickUpdateFile);
    }

    /** Az Android saját képernyője, ahol engedélyezni kell, hogy a CSSOS frissítést telepítsen. */
    @JavascriptInterface
    public boolean canInstallUpdates() {
        return Build.VERSION.SDK_INT < 26 || pm.canRequestPackageInstalls();
    }

    /** Az Android verziója, pl. „15”. */
    @JavascriptInterface
    public String androidVersion() {
        return Build.VERSION.RELEASE;
    }

    private void start(Intent i) {
        act.runOnUiThread(() -> {
            try {
                act.startActivity(i);
            } catch (Exception e) {
                act.callJs("notify('CSSOS', 'Ezt nem sikerült megnyitni.')");
            }
        });
    }

    /**
     * Ikon átalakítása képpé. Az Android 8+ „adaptív” ikonjait teljes négyzetként rajzoljuk meg,
     * hogy a CSSOS a saját csepp formájára vághassa őket.
     */
    private String iconToBase64(Drawable d) {
        Bitmap bmp = Bitmap.createBitmap(ICON_SIZE, ICON_SIZE, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        if (d instanceof AdaptiveIconDrawable) {
            AdaptiveIconDrawable a = (AdaptiveIconDrawable) d;
            // Az adaptív ikon rétegei 108 egységesek, ebből a középső 72 látszik → 1,5-szörös méret
            int pad = ICON_SIZE / 4;
            if (a.getBackground() != null) {
                a.getBackground().setBounds(-pad, -pad, ICON_SIZE + pad, ICON_SIZE + pad);
                a.getBackground().draw(c);
            }
            if (a.getForeground() != null) {
                a.getForeground().setBounds(-pad, -pad, ICON_SIZE + pad, ICON_SIZE + pad);
                a.getForeground().draw(c);
            }
        } else {
            c.drawColor(Color.WHITE);
            int p = ICON_SIZE / 6;
            d.setBounds(p, p, ICON_SIZE - p, ICON_SIZE - p);
            d.draw(c);
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
        return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }
}
