package com.gyrojoe.oculustvlauncher;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import java.io.IOException;
import java.util.Locale;

public class MainActivity extends Activity {

    private static final int WEBXR_PORT = 8765;
    private static final String LOCAL_WEBXR_URL = "http://127.0.0.1:%d/";
    private static final String TAG = "QuestGPTVrLauncher";

    private WebXrServer webXrServer;
    private boolean serverStarted = false;
    private boolean hasLaunchedExperience = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webXrServer = new WebXrServer(this.getApplicationContext(), WEBXR_PORT);
        try {
            webXrServer.start();
            serverStarted = true;
        } catch (IOException e) {
            serverStarted = false;
            Log.e(TAG, "Failed to start local WebXR server", e);
            stopServerIfRunning();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (!hasLaunchedExperience) {
            launchExperience();
            hasLaunchedExperience = true;
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        hasLaunchedExperience = false;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopServerIfRunning();
    }

    private void launchExperience() {
        String targetUrl;

        if (serverStarted) {
            targetUrl = String.format(Locale.US, LOCAL_WEBXR_URL, WEBXR_PORT);
        } else {
            targetUrl = this.getString(R.string.target_url);
            Log.w(TAG, "Falling back to remote QuestGPT URL");
        }

        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl));
        browserIntent.setPackage("com.oculus.browser");

        PackageManager pm = this.getPackageManager();
        if (browserIntent.resolveActivity(pm) == null) {
            browserIntent.setPackage(null);
        }

        this.startActivity(browserIntent);
        this.moveTaskToBack(true);
    }

    private void stopServerIfRunning() {
        if (webXrServer != null) {
            webXrServer.stop();
            webXrServer = null;
            serverStarted = false;
        }
    }
}
