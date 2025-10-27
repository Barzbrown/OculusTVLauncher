package com.gyrojoe.oculustvlauncher;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

public class MainActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String targetPackage = this.getString(R.string.target_package);

        Intent targetIntent = null;
        ComponentName targetComponent = null;

        if (targetPackage != null && !targetPackage.isEmpty()) {
            PackageManager pm = this.getPackageManager();
            targetIntent = pm.getLaunchIntentForPackage(targetPackage);
            if (targetIntent == null) {
                targetIntent = pm.getLeanbackLaunchIntentForPackage(targetPackage);
            }

            targetComponent = targetIntent != null ? targetIntent.getComponent() : null;
        }

        if (targetComponent == null) {
            Toast.makeText(this, this.getString(R.string.error_launch, targetPackage), Toast.LENGTH_LONG).show();
            this.finish();
        } else {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setComponent(new ComponentName("com.oculus.vrshell", "com.oculus.vrshell.MainActivity"));
            intent.setData(Uri.parse("com.oculus.tv"));
            intent.putExtra("uri", targetComponent.flattenToString());

            this.startActivity(intent);
        }
    }

    @Override
    protected void onStart() {
        super.onStart();

        this.finish();
    }
}
