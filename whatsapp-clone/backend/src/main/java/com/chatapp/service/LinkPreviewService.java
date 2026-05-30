package com.chatapp.service;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class LinkPreviewService {

    private static final Pattern URL_PATTERN = Pattern.compile(
            "(https?://(?:www\\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\\.[^\\s]{2,}|www\\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\\.[^\\s]{2,}|https?://(?:www\\.|(?!www))[a-zA-Z0-9]+\\.[^\\s]{2,}|www\\.[a-zA-Z0-9]+\\.[^\\s]{2,})",
            Pattern.CASE_INSENSITIVE
    );

    public record LinkPreview(String url, String title, String description, String imageUrl) {}

    public String extractUrl(String text) {
        if (text == null) return null;
        Matcher matcher = URL_PATTERN.matcher(text);
        if (matcher.find()) {
            String url = matcher.group(1);
            if (!url.startsWith("http")) {
                url = "http://" + url;
            }
            return url;
        }
        return null;
    }

    public LinkPreview generatePreview(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) WhatsAppClone/1.0")
                    .timeout(3000)
                    .get();

            String title = getMetaTag(doc, "og:title", "twitter:title");
            if (title == null || title.isEmpty()) {
                title = doc.title();
            }

            String description = getMetaTag(doc, "og:description", "twitter:description", "description");
            String imageUrl = getMetaTag(doc, "og:image", "twitter:image");

            // Only return a preview if we at least found a title
            if (title != null && !title.isEmpty()) {
                return new LinkPreview(url, title, description, imageUrl);
            }
        } catch (Exception e) {
            log.warn("Failed to generate link preview for url: " + url + " - " + e.getMessage());
        }
        return null;
    }

    private String getMetaTag(Document doc, String... tags) {
        for (String tag : tags) {
            Element element = doc.selectFirst("meta[property=" + tag + "]");
            if (element != null && element.attr("content") != null) {
                return element.attr("content");
            }
            element = doc.selectFirst("meta[name=" + tag + "]");
            if (element != null && element.attr("content") != null) {
                return element.attr("content");
            }
        }
        return null;
    }
}
