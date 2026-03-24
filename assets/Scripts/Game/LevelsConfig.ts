import { _decorator, CCString, Color, Prefab } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';
import { LevelData } from './LevelData';




@bh.createAssetMenu('LevelsConfig', 'Config/LevelsConfig')
@bh.scriptable('LevelsConfig')
export class LevelsConfig extends bh.ScriptableAsset {

    @property({
        type: LevelData
    })
    public levels: LevelData[] = []


} 