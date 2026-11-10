# Orerry ProGuard rules
# isMinifyEnabled = false in release, so rules here are advisory for future hardening.

# Preserve Room entity and DAO classes
-keep class com.orerry.app.OriginProfile { *; }
-keep interface com.orerry.app.ProfileDao { *; }
