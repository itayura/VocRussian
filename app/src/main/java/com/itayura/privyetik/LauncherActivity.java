package com.itayura.privyetik;

import android.net.Uri;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected Uri getLaunchingUrl() {
        return super.getLaunchingUrl();
    }
}
