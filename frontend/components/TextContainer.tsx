import 'bootstrap/dist/css/bootstrap.min.css';
import "./TextContainer.css";


interface Task {
  id: string;
  text: string;
  topic: string;
}
interface TextProps {
  task: Task | undefined;
}

const TextContainer = ({ task }: TextProps) => {
  const text = task?.text;

  return (
    <div className="genel">
      <div className="text-container">
        <h5>Text:</h5>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default TextContainer;