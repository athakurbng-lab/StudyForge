package com.studyforge.app;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Expose native APK installer bridge to JavaScript
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new UpdaterInterface(this), "AndroidUpdater");
        }
    }

    public static class UpdaterInterface {
        private final Context context;

        public UpdaterInterface(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void downloadAndInstall(String downloadUrl, String fileName) {
            try {
                // If Android 8.0+ (Oreo), verify unknown sources permission
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (!context.getPackageManager().canRequestPackageInstalls()) {
                        Intent manageSources = new Intent(
                                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                Uri.parse("package:" + context.getPackageName())
                        );
                        manageSources.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(manageSources);
                    }
                }

                File destFile = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName);
                if (destFile.exists()) {
                    destFile.delete();
                }

                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(downloadUrl));
                request.setTitle("Updating StudyForge OS...");
                request.setDescription("Downloading latest release APK");
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, fileName);
                request.setMimeType("application/vnd.android.package-archive");

                DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                if (manager == null) {
                    fallbackBrowser(downloadUrl);
                    return;
                }

                long downloadId = manager.enqueue(request);

                BroadcastReceiver receiver = new BroadcastReceiver() {
                    @Override
                    public void onReceive(Context ctx, Intent intent) {
                        long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                        if (id == downloadId) {
                            try {
                                File file = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName);
                                if (file.exists()) {
                                    Uri apkUri = FileProvider.getUriForFile(
                                            context,
                                            context.getPackageName() + ".fileprovider",
                                            file
                                    );
                                    Intent installIntent = new Intent(Intent.ACTION_VIEW);
                                    installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                                    installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                                    installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    context.startActivity(installIntent);
                                }
                            } catch (Exception ex) {
                                ex.printStackTrace();
                                fallbackBrowser(downloadUrl);
                            } finally {
                                try {
                                    context.unregisterReceiver(this);
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                };

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.registerReceiver(receiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
                } else {
                    context.registerReceiver(receiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
                }

            } catch (Exception e) {
                e.printStackTrace();
                fallbackBrowser(downloadUrl);
            }
        }

        private void fallbackBrowser(String url) {
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(browserIntent);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }
}
