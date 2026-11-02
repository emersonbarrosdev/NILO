import Phaser from 'phaser';
import { SaveSystem } from './SaveSystem';

export class GameState extends Phaser.Events.EventEmitter {
  private static instance: GameState;

  public lives = 3;
  public hp = 3;
  public maxHp = 3;
  public stamps = 0;
  public postcards = new Set<string>();
  public score = 0;
  public enemiesDefeated = 0;
  public stageStartTime = 0;
  public stageElapsedSeconds = 0;
  public checkpointX: number | null = null;
  public checkpointY: number | null = null;
  public checkpointId: string | null = null;
  public currentStage = '1-1';

  public static get(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public initNewGame(): void {
    this.lives = 3;
    this.hp = 3;
    this.stamps = 0;
    this.postcards.clear();
    this.score = 0;
    this.enemiesDefeated = 0;
    this.checkpointX = null;
    this.checkpointY = null;
    this.checkpointId = null;
    this.currentStage = '1-1';
    SaveSystem.get().save({ lives: 3 });
  }

  public startStage(stageId: string, startX = 40, startY = 130): void {
    this.currentStage = stageId;
    this.lives = Math.max(3, this.lives);
    this.hp = 3;
    this.maxHp = Math.max(this.maxHp, this.hp);
    this.stamps = 0;
    this.postcards.clear();
    this.enemiesDefeated = 0;
    this.stageStartTime = Date.now();
    this.stageElapsedSeconds = 0;
    this.checkpointX = startX;
    this.checkpointY = startY;
    this.checkpointId = null;
    this.emitChange();
  }

  public addStageTime(deltaSeconds: number): void {
    this.stageElapsedSeconds += deltaSeconds;
    this.emit('time-changed', this.stageElapsedSeconds);
  }

  public addHp(amount = 1): void {
    // Vidas e Corações 100% cumulativos: 3 -> 4 -> 5 -> 6... sem teto artificial!
    this.hp += amount;
    this.lives += amount;
    this.maxHp = Math.max(this.maxHp, this.hp);
    SaveSystem.get().save({ lives: this.lives });
    this.emit('hp-changed', this.hp, this.maxHp);
    this.emit('lives-changed', this.lives);
  }

  public takeDamage(amount = 1): boolean {
    this.hp = Math.max(0, this.hp - amount);
    this.emit('hp-changed', this.hp, this.maxHp);
    return this.hp <= 0;
  }

  public addStamps(amount = 1): boolean {
    this.stamps += amount;
    this.score += amount * 10;
    let earnedLife = false;

    if (this.stamps >= 50) {
      this.stamps -= 50;
      this.addLife(1);
      earnedLife = true;
    }

    this.emit('stamps-changed', this.stamps);
    this.emit('score-changed', this.score);
    return earnedLife;
  }

  public addLife(amount = 1): void {
    // Vidas acumulativas infinitas
    this.lives += amount;
    this.hp += amount;
    this.maxHp = Math.max(this.maxHp, this.hp);
    SaveSystem.get().save({ lives: this.lives });
    this.emit('lives-changed', this.lives);
    this.emit('hp-changed', this.hp, this.maxHp);
  }

  public loseLife(): boolean {
    this.lives = Math.max(0, this.lives - 1);
    this.hp = 3; // Restaura HP para o respawn
    SaveSystem.get().save({ lives: this.lives });
    this.emit('lives-changed', this.lives);
    this.emit('hp-changed', this.hp, this.maxHp);
    return this.lives <= 0; // true se Game Over
  }

  public collectPostcard(id: string): boolean {
    if (this.postcards.has(id)) return false;
    this.postcards.add(id);
    this.score += 500;
    this.emit('postcard-collected', id, this.postcards.size);
    this.emit('score-changed', this.score);
    return true;
  }

  public setCheckpoint(id: string, x: number, y: number): void {
    this.checkpointId = id;
    this.checkpointX = x;
    this.checkpointY = y;
    if (this.hp < 3) {
      this.hp = 3;
      this.emit('hp-changed', this.hp, this.maxHp);
    }
    this.emit('checkpoint-activated', id);
  }

  public addScore(points: number): void {
    this.score += points;
    this.emit('score-changed', this.score);
  }

  public recordDefeatEnemy(points = 100): void {
    this.enemiesDefeated++;
    this.addScore(points);
  }

  public continueGame(): void {
    this.lives = 3;
    this.hp = this.maxHp;
    SaveSystem.get().save({ lives: 3 });
  }

  public emitChange(): void {
    this.emit('hp-changed', this.hp, this.maxHp);
    this.emit('lives-changed', this.lives);
    this.emit('stamps-changed', this.stamps);
    this.emit('score-changed', this.score);
  }
}
