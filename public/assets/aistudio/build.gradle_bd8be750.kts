plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)

    // 👇 AKTIFKAN PLUGIN GOOGLE SERVICES DI SINI:
    id("com.google.gms.google-services")
}

android {
    namespace = "com.kafilasuci4.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.kafilasuci4.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 34
        versionName = "1.34"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    // 1. AndroidX & Material (Versi Stabil Bebas Error SDK 37)
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.9.0")

    // 2. Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.8.4")

    // 3. TWA Google (Untuk Fullscreen Web App)
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")

    // 4. FIREBASE (Gunakan BOM untuk manajemen versi otomatis tanpa konflik)
    implementation(platform("com.google.firebase:firebase-bom:33.4.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    implementation("com.google.firebase:firebase-messaging")

    // 5. Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
    testImplementation("junit:junit:4.13.2")
}