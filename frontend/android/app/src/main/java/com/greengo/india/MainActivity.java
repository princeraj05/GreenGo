package com.greengo.india;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread thread, final Throwable throwable) {
                try {
                    java.io.StringWriter sw = new java.io.StringWriter();
                    java.io.PrintWriter pw = new java.io.PrintWriter(sw);
                    throwable.printStackTrace(pw);
                    final String stackTrace = sw.toString();

                    android.util.Log.e("GreenGoCrash", "FATAL EXCEPTION: " + stackTrace);

                    new Thread() {
                        @Override
                        public void run() {
                            android.os.Looper.prepare();
                            new android.app.AlertDialog.Builder(MainActivity.this)
                                .setTitle("🚨 Native App Crash Detected")
                                .setMessage(stackTrace)
                                .setCancelable(false)
                                .setPositiveButton("Close App", new android.content.DialogInterface.OnClickListener() {
                                    @Override
                                    public void onClick(android.content.DialogInterface dialog, int which) {
                                        System.exit(1);
                                    }
                                })
                                .create()
                                .show();
                            android.os.Looper.loop();
                        }
                    }.start();

                    Thread.sleep(60000);
                } catch (Exception e) {
                    if (defaultHandler != null) {
                        defaultHandler.uncaughtException(thread, throwable);
                    }
                }
            }
        });
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Intercept UPI intents in the Capacitor WebView Client
        WebView webView = getBridge().getWebView();
        webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("upi://")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        e.printStackTrace();
                        return false;
                    }
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }
}
