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
    ndk.enable = false;
    # platforms.version = [ "32" "34" ];
    # systemImageTypes = [ "google_apis_playstore" ];
    # abis = [ "arm64-v8a" "x86_64" ];
    # cmake.version = [ "3.22.1" ];
    # cmdLineTools.version = "11.0";
    # tools.version = "26.1.1";
    # # platformTools.version defaults to latest from nixpkgs
    # buildTools.version = [ "30.0.3" ];
    # emulator = {
    #   enable = true;
    #   # version defaults to latest from nixpkgs
    # };
    # sources.enable = false;
    # systemImages.enable = true;
    # ndk.enable = true;
    # googleAPIs.enable = true;
    # googleTVAddOns.enable = true;
    # extras = [ "extras;google;gcm" ];
    # extraLicenses = [
    #   "android-sdk-preview-license"
    #   "android-googletv-license"
    #   "android-sdk-arm-dbt-license"
    #   "google-gdk-license"
    #   "intel-android-extra-license"
    #   "intel-android-sysimage-license"
    #   "mips-android-sysimage-license"
    # ];
    reactNative.enable = true;
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
