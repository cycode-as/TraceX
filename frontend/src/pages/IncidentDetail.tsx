import React from 'react';
import { useParams } from 'react-router-dom';


const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Incident Details {id ? `(${id})` : ''}
      </h1>
      <p className="mt-2 text-sm text-slate-400">Deep-dive Investigation & Graph Visualization</p>
    </div>
  );
};

export default IncidentDetail;
