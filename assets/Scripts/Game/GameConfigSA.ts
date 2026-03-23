import { _decorator, CCString, Prefab } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';

@bh.createAssetMenu('GameConfig', 'Config/GameConfig')
@bh.scriptable('GameConfig')
export class GameConfig extends bh.ScriptableAsset {

    @property(Prefab)
    public spoolPrefab: Prefab

    @property(Prefab)
    public slotPrefab: Prefab


    @property(CCString)
    public storeUrl: string


} 