import { useEffect, useState } from "react";
import { disasterAPI } from "../utils/api";

function Disasters() {
  const [disasters, setDisasters] = useState([]);

  useEffect(() => {
    disasterAPI.getAll().then(res => {
      setDisasters(res);
    });
  }, []);

  return (
    <div>
      <h2>Active Disasters</h2>

      {disasters.map(d => (
        <div key={d.id}>
          <h3>{d.type}</h3>
          <p>{d.description}</p>
          <p>Severity: {d.severity}</p>
        </div>
      ))}
    </div>
  );
}

export default Disasters;