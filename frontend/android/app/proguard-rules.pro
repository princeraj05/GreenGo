# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Preserve Capacitor Native bridge, Webview interface, and annotations
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable

-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep @interface com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

-keep class com.capacitorjs.plugins.** { *; }
-keep class com.capacitorjs.community.** { *; }

-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin { *; }

-keepclasseswithmembers class * {
  @android.webkit.JavascriptInterface <methods>;
}

# Capawesome Google Sign In plugin package
-keep class com.capawesome.capacitor.plugins.googlesignin.** { *; }

# Razorpay SDK obfuscation rules
-keep class com.razorpay.** {*;}
-dontwarn com.razorpay.**

# Standard Firebase / GMS rules that are safe and let R8 optimize/shrink remaining classes
-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
