import { _decorator, CCString, Color, Prefab } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';
import { LevelData } from './LevelData';
import { NewLevelData } from './NewLevelDataSA';


@bh.createAssetMenu('LevelsConfig', 'Config/LevelsConfig')
@bh.scriptable('LevelsConfig')
export class LevelsConfig extends bh.ScriptableAsset {

    @property({
        type: NewLevelData
    })
    public levels: NewLevelData[] = [];

    // Method to get level by index
    public getLevelByIndex(index: number): NewLevelData | null {
        if (index >= 0 && index < this.levels.length) {
            return this.levels[index];
        }
        return null;
    }
} 