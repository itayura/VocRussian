package com.itayura.privyetik;

import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Edge-to-Edge display compliance for Android 15+ (API 35/36)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Window window = getWindow();
            if (window != null) {
                window.setDecorFitsSystemWindows(false);
            }
        }
    }

    @Override
    protected Uri getLaunchingUrl() {
        return super.getLaunchingUrl();
    }
}
