# Consumer rules, applied to the app when it is minified (release builds).
#
# R8 optimized ML Kit's internal classes and broke them: every read failed in release builds
# (debug was fine) with "NullPointerException: ... Object.getClass() on a null object reference",
# thrown from InputImage.fromBitmap -> com.google.android.gms.internal.mlkit_vision_common.
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_** { *; }
