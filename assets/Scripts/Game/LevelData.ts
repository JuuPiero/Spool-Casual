import { _decorator, CCInteger, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';


@ccclass('SpoolData')
export class SpoolData {
    @property(CCInteger)
    public colorIndex: number = 0
}



@bh.createAssetMenu('LevelData', 'Config/LevelData')
@bh.scriptable('LevelData')
export class LevelData extends bh.ScriptableAsset {

    @property(CCInteger)
    public rows: number // max row

    @property(CCInteger)
    public columns: number // max cols

    @property(CCInteger)
    public maxSlots: number = 2

    @property({type: SpoolData})
    public spools: SpoolData[] = []

    @property(CCInteger)
    public maxWoolsInMain: number = 8

    @property(CCInteger)
    public maxSubRay: number = 2


} 