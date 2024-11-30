import { useContext, useEffect, useState } from "react";

import Modal from 'react-bootstrap/Modal';
import TextContainer from "../components/TextContainer";
import SoundRecorder from "../components/SoundRecorder";
import SignIn from "../components/SignIn";
import AuthContext from "../contexts/AuthProvider";
import InfoForm from "../components/InfoForm";
import 'bootstrap/dist/css/bootstrap.min.css';

import "./App.css";


function App() {
  // reach out to the auth context
  const { loggedIn, userName, userMetadata } = useContext(AuthContext);
  const [task, setTask] = useState<any>();
  const [taskDownloading, setTaskDownloading] = useState<boolean>(false);
  const [taskDone, setTaskDone] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [showInfoForm, setShowInfoForm] = useState<boolean>(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const appName = import.meta.env.VITE_APP_TITLE || 'Sound Collector App'

  // function which gets task from the server
  const getTask = async () => {
    setTaskDownloading(true);
    await fetch(
      `${apiUrl}/api/get-task`, {
      method: "POST",
      body: JSON.stringify({ username: userName }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // if data contains message property, it means that the task is done
        if (data.success) {
          setTask(data.task);
          setMessage('');
        } else {
          setTask(null)
          setMessage(data.message);
        }
        setTaskDownloading(false);
      });
  };

  // Run getTask when the component loads and only if the user is logged in
  useEffect(() => {
    if (loggedIn && userMetadata && !showInfoForm) {
      getTask();
    }
  }, [loggedIn, userMetadata, showInfoForm]); // Ensure the effect only runs when loggedIn changes

  if (!loggedIn) {
    return <SignIn />;
  }

  if (!userMetadata || showInfoForm) {
    const message = !userMetadata ? // means first login
      "Looks like this is your first login. Please fill the form to proceed."
      :
      "You can update your information here."
    return (
      <InfoForm
        message={message}
        onContinue={() => { setShowInfoForm(false) }}
      />
    )
  }

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <h5 style={{ marginLeft: "20px", marginBottom: "5px", marginTop: "5px" }}>{appName}</h5>
        <button
          className="btn btn-outline-light"
          style={{ marginRight: "20px" }}
          onClick={() => setShowInfoForm(!showInfoForm)}
        >
          {showInfoForm ? "Close Form" : "Update my info"}
        </button>
      </nav>

      {/* Show message dialog */}
      {(!taskDownloading && message) &&
        <div
          className="modal show"
          style={{ display: 'block', position: 'initial' }}
        >
          <Modal.Dialog>
            <Modal.Body>
              <p>{message}</p>
            </Modal.Body>
          </Modal.Dialog>
        </div>
      }
      {/* Show the text and sound recorder components */}
      {(!taskDownloading && (task !== undefined)&& (task !== null)) &&
        <>
          <TextContainer
            task={task}
          />
          <SoundRecorder
            taskId={task.id}
            getTask={getTask}
            taskDone={taskDone}
            setTaskDone={setTaskDone}
          />
        </>
      }
    </div>
  );
}

export default App;