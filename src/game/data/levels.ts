export type StageId = '1-1';

export interface StageSummary {
  id: StageId;
  world: number;
  stage: number;
  name: string;
  postcardCount: number;
}

export const STAGES: Record<StageId, StageSummary> = {
  '1-1': {
    id: '1-1',
    world: 1,
    stage: 1,
    name: 'Vale da Brisa',
    postcardCount: 3,
  },
};
