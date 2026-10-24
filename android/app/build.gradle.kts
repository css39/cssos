plugins {
    id("com.android.application")
}

// A CSSOS weboldal fájljai (index.html, *.css, *.js) a projekt fölötti mappában vannak.
// Építéskor ezek bemásolódnak az appba, így mindig a legfrissebb CSSOS kerül a telefonra.
val cssosWebDir: String = providers.gradleProperty("cssosWebDir")
    .getOrElse(rootDir.resolve("..").absolutePath)

// „2.0” → 200, „2.13” → 213 (a régi, 1-es kódú telepítésnél mindig nagyobb)
val cssosVersion: String = Regex("""version:\s*'([0-9.]+)'""")
    .find(File(cssosWebDir, "os.js").readText())?.groupValues?.get(1) ?: "0.0"
val cssosVersionCode: Int = cssosVersion.split(".").let { p ->
    (p.getOrNull(0)?.toIntOrNull() ?: 0) * 100 + (p.getOrNull(1)?.toIntOrNull() ?: 0)
}.coerceAtLeast(2)

val copyCssosWeb by tasks.registering(Copy::class) {
    from(cssosWebDir) { include("*.html", "*.css", "*.js", "*.woff2") }
    into(layout.buildDirectory.dir("generated/cssosWeb/cssos"))
}

android {
    namespace = "hu.cssos.launcher"
    compileSdk = 36

    defaultConfig {
        applicationId = "hu.cssos.launcher"
        minSdk = 26
        targetSdk = 36
        // A verzió a CSSOS-ból jön (os.js: version: '2.0'), így minden kiadás magától nagyobb számot kap,
        // és az Android frissítésként telepíti a régi fölé — az adatok megmaradnak.
        versionName = cssosVersion
        versionCode = cssosVersionCode
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets {
        getByName("main") {
            assets.srcDir(layout.buildDirectory.dir("generated/cssosWeb").get().asFile)
        }
    }
}

tasks.named("preBuild") { dependsOn(copyCssosWeb) }
