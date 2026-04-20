import { _decorator, CCString, Color, Prefab } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';




@bh.createAssetMenu('GameConfig', 'Config/GameConfig')
@bh.scriptable('GameConfig')
export class GameConfig extends bh.ScriptableAsset {

    @property(Prefab)
    public spoolPrefab: Prefab

    @property(Prefab)
    public slotPrefab: Prefab

    @property(Prefab)
    public woolPrefab: Prefab

    
    @property(Prefab)
    public ropePrefab: Prefab

    @property(Prefab)
    public completedEffect: Prefab

    @property(Prefab)
    public confettiEffect: Prefab

    @property(CCString)
    public storeUrl: string


    @property({type: Color})
    public colors: Color[] = []

    @property public collectTime = 0.1
} 