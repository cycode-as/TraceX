export interface SimulationRun {
  id: string;
  scenarioName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export const startSimulation = async (scenario: string): Promise<SimulationRun> => {
  return { id: 'sim-1', scenarioName: scenario, status: 'pending' };
};
