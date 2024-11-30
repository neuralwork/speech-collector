import { useReactMediaRecorder } from "react-media-recorder";
import "./SoundRecorder.css";
import { useState, useContext } from "react";
import AuthContext from "../contexts/AuthProvider";


interface Props {
  taskId: string;
  taskDone: boolean;
  getTask: () => void;
  setTaskDone: (taskDone: boolean) => void;
}

const SoundRecorder = ({ taskId, taskDone, getTask, setTaskDone }: Props) => {
  const { userName } = useContext(AuthContext);
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ video: false });
  const [soundUploading, setSoundUploading] = useState<boolean>(false);
  const [uploadFailed, setUploadFailed] = useState<boolean>(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const uploadSound = async () => {
    const formData = new FormData();
    formData.append("username", userName);
    formData.append("taskId", taskId);
    // now save the blob to a local sound file
    await fetch(mediaBlobUrl!).then((res) => {
      return res.blob();
    }).then((blob) => {
      const file = new File([blob], taskId.concat(".wav"), { type: "audio/wav" });
      return file;
    }).then((file) => {
      formData.append("file", file);
    });
    await fetch(
      `${apiUrl}/api/upload-sound`,
      {
        method: "POST",
        body: formData,
      })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) throw Error("Could not upload the recording.");
      })
  }
  // wrap buttons and recorder in a column
  return (
    <div className="container">
      <div className="sound-record-div">
      <div className="d-flex justify-content-center">
          <audio src={mediaBlobUrl!} controls />
        </div>
        <div className="d-flex justify-content-center">
          <div className="btn-group" role="group">
            <button
              type="button"
              className="btn btn-success"
              onClick={startRecording}
              disabled={status === "recording"}
            >
              🔴 Start Recording
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={stopRecording}
              disabled={status !== "recording"}
            >
              Stop Recording
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  setSoundUploading(true);
                  await uploadSound();
                  setTaskDone(true);
                  setUploadFailed(false);
                }
                catch (e) {
                  setUploadFailed(true);
                }
                finally {
                  setSoundUploading(false);
                }
              }}
              disabled={status !== "stopped" || soundUploading}
            >
              Upload
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setTaskDone(false);
                getTask();
              }}
              disabled={!taskDone}
            >
              Next Task
            </button>
          </div>
        </div>


        {soundUploading && <div className="alert alert-info" role="alert">
          <div className="spinner-border" role="status"/>
            Uploading
        </div>}
        {taskDone && <div className="alert alert-success" role="alert">
          Task done, you can continue to the next task.
        </div>}
        {uploadFailed && <div className="alert alert-dark" role="alert">
          Upload failed, please try again.
        </div>}
      </div>
    </div>
  );
};

export default SoundRecorder;