package com.kafilasuci4.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.webkit.*
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var strukHelper: StrukHelper
    private var backPressedTime: Long = 0
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            filePathCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        window.statusBarColor = Color.parseColor("#800000")

        webView = findViewById(R.id.webview)
        strukHelper = StrukHelper(this)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            databaseEnabled = true
        }

        webView.addJavascriptInterface(WebPrintInterface(this, strukHelper), "MesinPrint")
        
        // Menambahkan interface untuk mendeteksi aplikasi Android
        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun isAndroidApp(): Boolean = true
        }, "AndroidApp")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback = filePathCallback

                val intent = try {
                    fileChooserParams?.createIntent()
                } catch (e: Exception) {
                    null
                } ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*"
                }

                try {
                    fileChooserLauncher.launch(intent)
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "Gagal membuka pemilih file", Toast.LENGTH_SHORT).show()
                    this@MainActivity.filePathCallback = null
                    return false
                }
                return true
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url.toString()
                
                if (url.startsWith("intent://")) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        if (intent != null) {
                            intent.addCategory(Intent.CATEGORY_BROWSABLE)
                            intent.component = null
                            intent.selector = null
                            startActivity(intent)
                            return true
                        }
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "WhatsApp tidak ditemukan", Toast.LENGTH_SHORT).show()
                    }
                    return true
                }

                if (url.contains("api.whatsapp.com") || url.contains("wa.me")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Gagal membuka WhatsApp", Toast.LENGTH_SHORT).show()
                    }
                    return true
                }
                
                return false
            }
        }
        
        webView.loadUrl("https://kflslaundry.web.app/")
    }

    override fun onBackPressed() {
        val jsScript = """
            (function() {
                if (typeof window.__kembaliKeDashboard === 'function' && window.__kembaliKeDashboard() === 'handled') return 'handled';
                
                var closeBtn = document.querySelector('button svg.lucide-x')?.closest('button');
                if (closeBtn) { closeBtn.click(); return 'handled'; }
                
                var arrowLeft = document.querySelector('button svg.lucide-arrow-left')?.closest('button');
                if (arrowLeft) { arrowLeft.click(); return 'handled'; }
                
                var kembaliBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('kembali'));
                if (kembaliBtn) { kembaliBtn.click(); return 'handled'; }
                
                return 'at_dashboard';
            })();
        """.trimIndent()

        webView.evaluateJavascript(jsScript) { result ->
            if (result?.replace("\"", "")?.trim() == "handled") return@evaluateJavascript

            if (backPressedTime + 2000 > System.currentTimeMillis()) {
                finish()
            } else {
                Toast.makeText(this, "Tekan sekali lagi untuk keluar", Toast.LENGTH_SHORT).show()
                backPressedTime = System.currentTimeMillis()
            }
        }
    }
}