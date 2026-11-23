
import {
  faHome,
  faNewspaper,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { JSX, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { ProfileNavButton } from "../components/ProfileNavButton";

export default function ReportDumping(): JSX.Element {
  const router = useRouter();
 
  const [permission, requestPermission] = useCameraPermissions();

  const [microphonePermission, requestMicrophonePermission] =
  useMicrophonePermissions();

  const cameraRef = useRef<CameraView | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraMode, setCameraMode] = useState<"picture" | "video">("picture");

  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  // Open the camera in picture or video mode.
  const openCamera = async (mode: "picture" | "video") => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();

        if (!result.granted) {
          Alert.alert(
            "Camera Permission",
            "Camera permission is required to capture photos and videos.",
          );
          return;
        }
      }

      setCameraReady(false);
      setCameraMode(mode);
      setCameraOpen(true);
    } catch (error) {
      Alert.alert(
        "Camera unavailable",
        error instanceof Error ? error.message : "Could not open the camera.",
      );
    }
  };

  // Capture a photo.
  const takePhoto = async () => {
    if (!cameraRef.current || !cameraReady || isTakingPhoto) return;

    if (photoUris.length >= 10) {
      Alert.alert("Photo limit reached", "You can capture a maximum of 10 photos.");
      return;
    }

    setIsTakingPhoto(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (!photo?.uri) {
        throw new Error("The camera did not return a photo.");
      }

      setPhotoUris((previousPhotos) => [...previousPhotos, photo.uri]);
    } catch (error) {
      Alert.alert(
        "Photo not captured",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsTakingPhoto(false);
    }
  };

  // Start recording a video.
const recordVideo = async () => {
  if (!cameraRef.current || !cameraReady || isRecording) return;

  if (videoUri) {
    Alert.alert(
      "Video already recorded",
      "Remove the existing video before recording another one.",
    );
    return;
  }

  try {
    // Request microphone permission before recording.
    if (!microphonePermission?.granted) {
      const result = await requestMicrophonePermission();

      if (!result.granted) {
        Alert.alert(
          "Microphone Permission Required",
          "Please allow microphone access to record videos with sound.",
        );
        return;
      }
    }

    setIsRecording(true);

    const video = await cameraRef.current.recordAsync({
      maxDuration: 60,
    });

    if (video?.uri) {
      setVideoUri(video.uri);
    } else {
      Alert.alert("Recording failed", "The camera did not return a video.");
    }
  } catch (error) {
    Alert.alert(
      "Video recording failed",
      error instanceof Error ? error.message : "Please try again.",
    );
  } finally {
    setIsRecording(false);
    setCameraOpen(false);
    setCameraReady(false);
  }
};

  // Stop recording.
  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  // Close the camera.
  const closeCamera = () => {
    if (isRecording) {
      cameraRef.current?.stopRecording();
      return;
    }

    setCameraOpen(false);
    setCameraReady(false);
  };

  // Remove a captured photo.
  const removePhoto = (uri: string) => {
    setPhotoUris((previousPhotos) =>
      previousPhotos.filter((photo) => photo !== uri),
    );
  };

  // Remove the recorded video.
  const removeVideo = () => {
    setVideoUri(null);
  };

  // Continue to the location screen.
  const continueToLocation = () => {
    if (photoUris.length === 0 && !videoUri) {
      Alert.alert(
        "Media required",
        "Capture at least one photo or record a video of the dumping site.",
      );
      return;
    }

    router.push({
      pathname: "/location",
      params: {
        photoUri: photoUris[0] ?? "",
        photoUris: JSON.stringify(photoUris),
        videoUri: videoUri ?? "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <View style={styles.logoMark}>
              <Image
                source={require("../../assets/images/cleanmystreet.png")}
                style={styles.logo}
              />
            </View>

            <Text style={styles.brandName}>Report a Dumping Site</Text>
          </View>

          {/* INTRODUCTION */}
          <View style={styles.introduction}>
            <Text style={styles.heading}>Tell us what you found</Text>

            <Text style={styles.description}>
              Your report helps us verify and fund cleanup.
            </Text>
          </View>

          {/* MEDIA SECTION */}
          <Text style={styles.uploadTitle}>Capture Photos and Video</Text>

          <Text style={styles.mediaInstructions}>
            Capture up to 10 photos and one video using your camera.
          </Text>

          {/* CAMERA AREA */}
          <View style={styles.imageBox}>
            {cameraOpen ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="back"
                  mode={cameraMode}
                  onCameraReady={() => setCameraReady(true)}
                />

                <Pressable
                  style={styles.closeCameraButton}
                  onPress={closeCamera}
                  disabled={isTakingPhoto}
                >
                  <Text style={styles.closeCameraText}>
                    {isRecording ? "Stop and Close" : "Close Camera"}
                  </Text>
                </Pressable>

                {cameraMode === "picture" ? (
                  <Pressable
                    style={[
                      styles.captureButton,
                      (!cameraReady || isTakingPhoto) && styles.disabledButton,
                    ]}
                    onPress={takePhoto}
                    disabled={!cameraReady || isTakingPhoto}
                  >
                    <Text style={styles.closeCameraText}>
                      {isTakingPhoto ? "Capturing..." : "Take Photo"}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[
                      styles.captureButton,
                      (!cameraReady || isRecording) && styles.disabledButton,
                    ]}
                    onPress={isRecording ? stopRecording : recordVideo}
                    disabled={!cameraReady}
                  >
                    <Text style={styles.closeCameraText}>
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.previewContainer}>
                {photoUris.length === 0 && !videoUri ? (
                  <>
                    <Svg width="60%" height={120} viewBox="0 0 150 140">
                      <Path
                        d="M20 48c0-8 6-14 14-14h13l13-18h45l13 18h13c8 0 14 6 14 14v62c0 8-6 14-14 14H34c-8 0-14-6-14-14V48Z"
                        fill="none"
                        stroke="#1F7A3F"
                        strokeWidth={2}
                      />
                      <Circle
                        cx={82.5}
                        cy={79}
                        r={29}
                        fill="none"
                        stroke="#1F7A3F"
                        strokeWidth={2}
                      />
                    </Svg>

                    <Text style={styles.emptyText}>
                      Your captured photos and video will appear here.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.previewTitle}>
                      Captured Photos ({photoUris.length}/10)
                    </Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photoList}
                    >
                      {photoUris.map((uri, index) => (
                        <View key={`${uri}-${index}`} style={styles.photoItem}>
                          <Image
                            source={{ uri }}
                            style={styles.photoThumbnail}
                          />

                          <Pressable
                            style={styles.removeButton}
                            onPress={() => removePhoto(uri)}
                          >
                            <Text style={styles.removeButtonText}>Remove</Text>
                          </Pressable>
                        </View>
                      ))}
                    </ScrollView>

                    {videoUri && (
                      <View style={styles.videoPreview}>
                        <Text style={styles.videoText}>
                          Video recorded successfully
                        </Text>

                        <Pressable onPress={removeVideo}>
                          <Text style={styles.removeVideoText}>
                            Remove Video
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>

          {/* CAMERA OPTIONS */}
          {!cameraOpen && (
            <View style={styles.mediaButtons}>
              <Pressable
                style={styles.mediaButton}
                onPress={() => openCamera("picture")}
              >
                <Text style={styles.mediaButtonText}>Take Photo</Text>
              </Pressable>

              <Pressable
                style={styles.mediaButton}
                onPress={() => openCamera("video")}
                disabled={!!videoUri}
              >
                <Text style={styles.mediaButtonText}>
                  {videoUri ? "Video Recorded" : "Record Video"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* NEXT BUTTON */}
          <Pressable
            style={styles.nextButton}
            onPress={continueToLocation}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>

          {/* INFORMATION */}
          <Text style={styles.notificationText}>
            You'll be notified as your report is reviewed and cleanup campaigns
            are created.
          </Text>
        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <Pressable
            onPress={() => router.push("/home")}
            accessibilityLabel="Go to Home"
          >
            <FontAwesomeIcon icon={faHome} size={20} color="#124A2A" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/news")}
            accessibilityLabel="View News"
          >
            <FontAwesomeIcon icon={faNewspaper} size={20} color="#124A2A" />
          </Pressable>

          <Pressable
            style={styles.addButton}
            disabled
            accessibilityLabel="Report a dumping site"
            accessibilityState={{ selected: true }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/community")}
            accessibilityRole="button"
            accessibilityLabel="Open community messages"
          >
            <FontAwesomeIcon icon={faUsers} size={20} color="#124A2A" />
          </Pressable>

          <ProfileNavButton />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },

  header: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  backIcon: {
    color: "#17201A",
    fontSize: 32,
    lineHeight: 32,
    marginRight: 8,
  },

  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 16,
    backgroundColor: "#1F7A3F",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },

  brandName: {
    color: "#17201A",
    fontSize: 9,
    fontWeight: "500",
    marginLeft: 6,
  },

  introduction: {
    marginBottom: 6,
  },

  heading: {
    color: "#17201A",
    fontSize: 11,
    fontWeight: "400",
    marginBottom: 2,
  },

  description: {
    color: "#68706A",
    fontSize: 8,
  },

  uploadTitle: {
    color: "#17201A",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },

  mediaInstructions: {
    color: "#68706A",
    fontSize: 9,
    marginBottom: 8,
  },

  imageBox: {
    width: "100%",
    aspectRatio: 0.94,
    backgroundColor: "#D9D9D9",
    borderRadius: 7,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  cameraContainer: {
    width: "100%",
    height: "100%",
  },

  camera: {
    width: "100%",
    height: "100%",
  },

  previewContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },

  emptyText: {
    color: "#68706A",
    fontSize: 10,
    textAlign: "center",
    marginTop: 8,
  },

  previewTitle: {
    color: "#17201A",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },

  photoList: {
    alignItems: "center",
    paddingHorizontal: 5,
    gap: 10,
  },

  photoItem: {
    alignItems: "center",
  },

  photoThumbnail: {
    width: 105,
    height: 120,
    borderRadius: 7,
  },

  removeButton: {
    backgroundColor: "#B3261E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    marginTop: 5,
  },

  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
  },

  videoPreview: {
    alignItems: "center",
    marginTop: 12,
    gap: 7,
  },

  videoText: {
    color: "#17201A",
    fontSize: 10,
    fontWeight: "600",
  },

  removeVideoText: {
    color: "#B3261E",
    fontSize: 10,
    fontWeight: "600",
  },

  closeCameraButton: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "#17201A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 7,
  },

  captureButton: {
    position: "absolute",
    bottom: 58,
    alignSelf: "center",
    backgroundColor: "#1F7A3F",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 7,
  },

  disabledButton: {
    opacity: 0.55,
  },

  closeCameraText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  mediaButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 15,
  },

  mediaButton: {
    flex: 1,
    backgroundColor: "#1F7A3F",
    paddingVertical: 12,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  mediaButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },

  nextButton: {
    width: "100%",
    height: 36,
    backgroundColor: "#94D9AE",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "400",
  },

  notificationText: {
    color: "#68706A",
    fontSize: 7,
    lineHeight: 10,
    textAlign: "left",
  },

  bottomNav: {
    minHeight: 51,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#68706A",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#17201A",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
  },

  notificationTextUnused: {
    color: "#68706A",
  },
});
