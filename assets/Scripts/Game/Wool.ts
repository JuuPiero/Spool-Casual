import { _decorator, BoxCollider, Color, Component, ITriggerEvent, MeshRenderer, Node, Quat, Vec3 } from 'cc';
import { ServiceLocator } from '../ServiceLocator';
import { WoolManager } from './WoolManager';
import { SlotManager } from './SlotManager';
const { ccclass, property } = _decorator;

@ccclass('Wool')
export class Wool extends Component {

    private samples: Vec3[] = [];

    private t: number = 0; // progress
    private speed: number = 1;

    @property(Color)
    public color: Color;

    public init(samples: Vec3[], offset: number, speed: number) {
        this.samples = samples;
        this.speed = speed;

        // 👇 set vị trí ban đầu đúng luôn
        this.t = offset;
        this.applyPosition();
    }

    update(dt: number) {
        if (this.samples.length < 2) return;

        // 👇 move đều
        this.t += this.speed * dt;

        // loop
        if (this.t >= this.samples.length) {
            this.t -= this.samples.length;
        }

        this.applyPosition();
    }

    private applyPosition() {
        const index = Math.floor(this.t) % this.samples.length;
        const nextIndex = (index + 1) % this.samples.length;

        const a = this.samples[index];
        const b = this.samples[nextIndex];

        const lerpT = this.t - index;

        const pos = new Vec3();
        Vec3.lerp(pos, a, b, lerpT);

        this.node.setWorldPosition(pos);

        // rotate theo hướng
        const dir = new Vec3();
        Vec3.subtract(dir, b, a);
        dir.normalize();

        const rot = new Quat();
        Quat.fromViewUp(rot, dir);

        this.node.setWorldRotation(rot);
    }

    public setColor(color: Color) {
        const items = this.node.getComponentsInChildren(MeshRenderer);
        this.color = color;

        for (const element of items) {
            element.material.setProperty("baseColor", color);
        }
    }
}