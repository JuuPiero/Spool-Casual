import { _decorator, CCInteger, Component, JsonAsset, Node, Prefab, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';


@ccclass('SpoolData')
export class SpoolData {
    @property(CCInteger)
    public colorIndex: number = 0
}


@bh.createAssetMenu('LevelDataSA', 'Config/LevelDataSA')
@bh.scriptable('LevelDataSA')
export class LevelDataSA extends bh.ScriptableAsset {

    @property(CCInteger)
    public maxSlots: number = 2
    @property(CCInteger)
    public maxSubRay: number = 2

    @property(JsonAsset) public levelJson: JsonAsset = null
    @property(Prefab) public levelPrefab: Prefab = null

    @property(Vec3) public knots: Vec3[] = []

} 