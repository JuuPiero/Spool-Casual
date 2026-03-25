import { _decorator, BoxCollider, Color, Component, MeshRenderer, Node, Quat, Vec3 } from 'cc';
import { Spline } from '../Spline';
import { ServiceLocator } from '../ServiceLocator';
import { WoolManager } from './WoolManager';

const { ccclass, property } = _decorator;

@ccclass('Wool')
export class Wool extends Component {

    private samples: Vec3[] = [];

    private t: number = 0; // progress
    private speed: number = 1;

    @property(Color)
    public color: Color;

    @property({ type: Node })
    public woolItems: Node[] = []


    private distance: number = 0;
    private totalLength: number = 0;
    public isInitalized = false


    // public init(samples: Vec3[], offset: number, speed: number, spline: Spline) {
    //     this.samples = samples;
    //     this.speed = speed;

    //     this.totalLength = spline.totalLength;

    //     this.distance = offset;
    //     this.isInitalized = true
    //     this.applyPosition(spline);

    // }
    // update(dt: number) {
    //     if(!this.isInitalized) return
    //     if (this.samples.length < 2) return;

    //     this.distance += this.speed * dt;

    //     if (this.distance >= this.totalLength) {
    //         this.distance -= this.totalLength;
    //     }

    //     // this.applyPosition(ServiceLocator.get(WoolManager).spline);
    // }

    // private applyPosition(spline: Spline) {
    //     const pos = spline.getPointAtDistance(this.samples, this.distance);
    //     this.node.setWorldPosition(pos);

    //     // hướng
    //     const nextPos = spline.getPointAtDistance(this.samples, this.distance + 0.1);

    //     const dir = new Vec3();
    //     Vec3.subtract(dir, nextPos, pos);
    //     dir.normalize();

    //     const rot = new Quat();
    //     Quat.fromViewUp(rot, dir);

    //     this.node.setWorldRotation(rot);
    // }
    public setColor(color: Color) {
        const items = this.node.getComponentsInChildren(MeshRenderer);
        this.color = color;

        for (const element of items) {
            element.material.setProperty("albedo", color);
        }
    }
}