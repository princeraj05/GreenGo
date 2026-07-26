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

# Preserve Capacitor Native bridge and Webview interface classes
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable
-keep class com.getcapacitor.Bridge { *; }
-keep class com.getcapacitor.Plugin { *; }
-keep class com.getcapacitor.PluginCall { *; }
-keep class com.getcapacitor.PluginMethod { *; }
-keep class com.getcapacitor.JSObject { *; }
-keep class com.getcapacitor.JSArray { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { 
    @com.getcapacitor.annotation.PermissionCallback <methods>; 
    @com.getcapacitor.annotation.ActivityCallback <methods>; 
    @com.getcapacitor.annotation.Permission <fields>; 
}
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
