package hu.cssos.launcher;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Online frissítés a GitHubról (https://css39.github.io/cssos/).
 *
 * update.json: { "version": "2.1", "code": 201, "minApk": 201, "files": ["index.html", "os.js", ...] }
 *  - Ha csak a CSSOS (weboldal) változott: a fájlok letöltődnek a telefon tárhelyére, és a következő
 *    indításkor már azokat használja — telepítés nélkül, az adatok megmaradnak.
 *  - Ha a „minApk” nagyobb a telepített appnál, az Android-részt is frissíteni kell: ilyenkor az új
 *    CSSOS.apk letöltését ajánlja fel.
 */
class Updater {
    static final String BASE = "https://css39.github.io/cssos/";

    private final Context ctx;

    Updater(Context ctx) {
        this.ctx = ctx;
    }

    /** A letöltött CSSOS mappája a telefon tárhelyén. */
    File webDir() {
        return new File(ctx.getFilesDir(), "cssos");
    }

    int apkCode() {
        try {
            PackageInfo p = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? (int) p.getLongVersionCode() : p.versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    /** A letöltött CSSOS verziókódja (0, ha még nincs letöltve). */
    int downloadedCode() {
        File f = new File(webDir(), "code.txt");
        try (InputStream in = new java.io.FileInputStream(f)) {
            return Integer.parseInt(new String(readAll(in), StandardCharsets.UTF_8).trim());
        } catch (Exception e) {
            return 0;
        }
    }

    /** Ha a letöltött CSSOS újabb, mint ami az appba van építve, azt kell betölteni. */
    String startUrl() {
        File index = new File(webDir(), "index.html");
        if (downloadedCode() > apkCode() && index.exists()) return Uri.fromFile(index).toString();
        return "file:///android_asset/cssos/index.html";
    }

    String currentVersion() {
        if (downloadedCode() > apkCode()) {
            File v = new File(webDir(), "version.txt");
            try (InputStream in = new java.io.FileInputStream(v)) {
                return new String(readAll(in), StandardCharsets.UTF_8).trim();
            } catch (Exception ignored) {
            }
        }
        try {
            return ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Ellenőrzés és (ha kell) letöltés. Az eredményt a status kapja meg:
     * latest, ready (újraindításra kész), apk (új app kell), offline.
     */
    void check(Status status) {
        new Thread(() -> {
            try {
                // Az esetleges BOM-ot (láthatatlan jel a fájl elején) levágjuk
                String text = new String(get(BASE + "update.json"), StandardCharsets.UTF_8).replace("﻿", "");
                JSONObject u = new JSONObject(text);
                String version = u.optString("version", "");
                int code = u.getInt("code");
                int minApk = u.optInt("minApk", 0);
                int current = Math.max(apkCode(), downloadedCode());

                if (minApk > apkCode()) {
                    status.done("apk", version);
                    return;
                }
                if (code <= current) {
                    status.done("latest", currentVersion());
                    return;
                }
                // Letöltés egy ideiglenes mappába; csak ha minden fájl megjött, cseréljük le a régit
                File tmp = new File(ctx.getFilesDir(), "cssos_new");
                deleteDir(tmp);
                if (!tmp.mkdirs()) throw new Exception("mkdir");
                JSONArray files = u.getJSONArray("files");
                for (int i = 0; i < files.length(); i++) {
                    String name = files.getString(i);
                    if (name.contains("/") || name.contains("..")) continue; // csak a fő mappa fájljai
                    write(new File(tmp, name), get(BASE + name));
                }
                if (!new File(tmp, "index.html").exists()) throw new Exception("index");
                write(new File(tmp, "code.txt"), String.valueOf(code).getBytes(StandardCharsets.UTF_8));
                write(new File(tmp, "version.txt"), version.getBytes(StandardCharsets.UTF_8));
                File dir = webDir();
                deleteDir(dir);
                if (!tmp.renameTo(dir)) throw new Exception("rename");
                status.done("ready", version);
            } catch (Exception e) {
                status.done("offline", "");
            }
        }).start();
    }

    interface Status {
        void done(String state, String version);
    }

    // ---------- segédfüggvények ----------
    private static byte[] get(String url) throws Exception {
        // A „?t=” miatt mindig a legfrissebb fájl jön, nem egy régi, tárolt példány
        HttpURLConnection c = (HttpURLConnection) new URL(url + (url.contains("?") ? "&" : "?") + "t=" + System.currentTimeMillis()).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        c.setUseCaches(false);
        try {
            if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode());
            try (InputStream in = c.getInputStream()) {
                return readAll(in);
            }
        } finally {
            c.disconnect();
        }
    }

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        return out.toByteArray();
    }

    private static void write(File f, byte[] data) throws Exception {
        try (FileOutputStream out = new FileOutputStream(f)) {
            out.write(data);
        }
    }

    private static void deleteDir(File d) {
        File[] list = d.listFiles();
        if (list != null) for (File f : list) {
            if (f.isDirectory()) deleteDir(f);
            else //noinspection ResultOfMethodCallIgnored
                f.delete();
        }
        //noinspection ResultOfMethodCallIgnored
        d.delete();
    }
}
