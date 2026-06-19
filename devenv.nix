{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  # https://devenv.sh/basics/
  env.GREET = "devenv";

  # https://devenv.sh/packages/
  packages = [ pkgs.git ];

  android = {
    enable = true;
    reactNative.enable = true;
    platforms.version = [ "32" "34" "35" "36" ];
    buildTools.version = [ "35.0.0" "36.0.0" ];
    cmake.version = [ "3.22.1" ];
    cmdLineTools.version = "11.0";
    tools.version = "26.1.1";
    
    ndk = {
      enable = true;
      version = [ "27.1.12297006" ];
    };
    emulator = {
       enable = true;
     };
    googleAPIs.enable = true;
    googleTVAddOns.enable = true;
    extras = [ "extras;google;gcm" ];
    extraLicenses = [
      "android-sdk-preview-license"
      "android-googletv-license"
      "android-sdk-arm-dbt-license"
      "google-gdk-license"
      "intel-android-extra-license"
      "intel-android-sysimage-license"
      "mips-android-sysimage-license"
    ];
    sources.enable = false;
    systemImages.enable = true;
  };

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
  };
  # https://devenv.sh/basics/
  enterShell = ''
    hello         # Run scripts directly
    git --version # Use packages
  '';

  # https://devenv.sh/tests/
  enterTest = ''
    echo "Running tests"
    git --version | grep --color=auto "${pkgs.git.version}"
  '';

}
