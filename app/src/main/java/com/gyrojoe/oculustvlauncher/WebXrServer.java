package com.gyrojoe.oculustvlauncher;

import android.content.Context;
import android.content.res.AssetManager;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import org.nanohttpd.protocols.http.IHTTPSession;
import org.nanohttpd.protocols.http.NanoHTTPD;

public class WebXrServer extends NanoHTTPD {

    private static final String WEBXR_ROOT = "webxr";
    private final AssetManager assetManager;

    public WebXrServer(Context context, int port) {
        super(port);
        this.assetManager = context.getAssets();
    }

    @Override
    public NanoHTTPD.Response serve(IHTTPSession session) {
        String uri = session.getUri();
        if (uri == null || uri.isEmpty() || "/".equals(uri)) {
            uri = "index.html";
        } else if (uri.startsWith("/")) {
            uri = uri.substring(1);
        }

        String assetPath = WEBXR_ROOT + "/" + uri;

        try {
            InputStream stream = assetManager.open(assetPath);
            String mimeType = resolveMimeType(assetPath);
            return newChunkedResponse(NanoHTTPD.Response.Status.OK, mimeType, stream);
        } catch (IOException notFound) {
            return newFixedLengthResponse(
                NanoHTTPD.Response.Status.NOT_FOUND,
                NanoHTTPD.MIME_PLAINTEXT,
                String.format(Locale.US, "Resource %s not found", assetPath)
            );
        }
    }

    private String resolveMimeType(String path) {
        String lower = path.toLowerCase(Locale.US);
        if (lower.endsWith(".html")) {
            return "text/html";
        }
        if (lower.endsWith(".css")) {
            return "text/css";
        }
        if (lower.endsWith(".js")) {
            return "application/javascript";
        }
        if (lower.endsWith(".json")) {
            return "application/json";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        return NanoHTTPD.MIME_PLAINTEXT;
    }
}
