package com.dbarchitect.backend.utils;

import java.util.HashMap;
import java.util.Map;

public class Constants {
    public  static final Map<String, String> MODELS_DESCRIPTION_MAP = new HashMap<>(
            Map.of(
                    "gemini-2.5-pro", "Our state-of-the-art multipurpose model, which excels at coding and complex reasoning tasks.",
                    "gemini-2.5-flash", "Our first hybrid reasoning model which supports a 1M token context window and has thinking budgets.",
                    "gemini-2.5-flash-preview-09-2025", "The latest model based on the 2.5 Flash model. 2.5 Flash Preview is best for large scale processing, low-latency, high volume tasks that require thinking, and agentic use cases.",
                    "gemini-2.5-flash-lite", "Our smallest and most cost effective model, built for at scale usage.",
                    "gemini-2.5-flash-lite-preview-09-2025", "The latest model based on Gemini 2.5 Flash lite optimized for cost-efficiency, high throughput and high quality.",
                    "gemini-2.0-flash", "Our most balanced multimodal model with great performance across all tasks, with a 1 million token context window, and built for the era of Agents.",
                    "gemini-2.0-flash-lite", "Our smallest and most cost effective model, built for at scale usage."
            )
    );

    public static final Map<String, String> MODELS_MAP = new HashMap<>(
            Map.of(
                    "gemini-2.5-pro", "gemini-2.5-pro",
                    "gemini-2.5-flash", "gemini-2.5-flash",
                    "gemini-2.5-flash-preview-09-2025", "gemini-2.5-flash-preview-09-2025",
                    "gemini-2.5-flash-lite", "gemini-2.5-flash-lite",
                    "gemini-2.5-flash-lite-preview-09-2025", "gemini-2.5-flash-lite-preview-09-2025",
                    "gemini-2.0-flash", "gemini-2.0-flash",
                    "gemini-2.0-flash-lite", "gemini-2.0-flash-lite"
            )
    );
}
