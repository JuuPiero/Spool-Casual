import { _decorator, Component, Node, Prefab } from 'cc';
import { LevelDataSA } from './LevelDataSA';
import { Spline } from '../Spline';
import { SplineInstantiate } from '../SplineInstantiate';
import { SubRay } from './SubRay';
const { ccclass, property } = _decorator;

@ccclass('LevelSetup')
export class LevelSetup extends Component {
    
    @property(Prefab) splineItemPrefab: Prefab = null
    @property(Node) public rayRoot: Node = null
    @property({ type: [Node] })
    public subRays: Node[] = [];

    @property(Node)
    public knotContainer: Node = null

    @property(LevelDataSA) public levelData: LevelDataSA = null


    private _setup: boolean = false;
    @property public get setup(): boolean {
        return this._setup;
    }
    public set setup(value: boolean) {
        console.log("hello world");
        this.setupLevel()
        // if (value && !this._setup) {
        //     this._setup = true;
        //     this.setupLevel();
        // }
    }

    public setupLevel(): void {
        const root = new Node("Level");
        root.setParent(this.node);
        if(this.rayRoot) {
            this.rayRoot.setParent(root);
            this.rayRoot.addComponent(Spline)
            const splineInstantiate = this.rayRoot.addComponent(SplineInstantiate)
            splineInstantiate.itemToInstantiate = this.splineItemPrefab; 
        }

        this.subRays.forEach((subRay, index) => {
            subRay.addComponent(Spline)
            const splineInstantiate = subRay.addComponent(SplineInstantiate)
            splineInstantiate.itemToInstantiate = this.splineItemPrefab; 
            subRay.addComponent(SubRay)
        })
    }
}
