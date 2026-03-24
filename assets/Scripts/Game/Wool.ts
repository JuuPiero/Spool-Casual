import { _decorator, BoxCollider, Color, Component, ITriggerEvent, MeshRenderer, Node, Quat, Vec3 } from 'cc';
import { ServiceLocator } from '../ServiceLocator';
import { WoolManager } from './WoolManager';
const { ccclass, property } = _decorator;

@ccclass('Wool')
export class Wool extends Component {

    public quantity: number = 20


    private samples: Vec3[] = [];

    private currentIndex = 0;
    private speed = 5;

    protected onLoad(): void {
        let collider = this.getComponent(BoxCollider);
        if (collider) {
            
            collider.on('onTriggerEnter', this.onTriggerEnter, this);

        }
    }

    private onTriggerEnter(event: ITriggerEvent) {
        console.log(event.otherCollider.node.name + " entered trigger");
    }

    protected start(): void {
        this.samples = ServiceLocator.get(WoolManager).spline.getSamples(50)
    }

    protected setColor(color: Color) {
        const items = this.node.getComponentsInChildren(MeshRenderer)

        for (const element of items) {
            element.material.setProperty("baseColor", color)
        }
    }


    update(dt: number) {
        if (this.samples.length < 2) return;

        const target = this.samples[this.currentIndex];

        const pos = this.node.worldPosition.clone();
        const dir = target.clone().subtract(pos);

        const dist = dir.length();

        if (dist < 0.1) {
            this.currentIndex++;

            if (this.currentIndex >= this.samples.length) {
                this.currentIndex = 0;
            }

            return;
        }

        dir.normalize();

        const move = dir.multiplyScalar(this.speed * dt);
        this.node.setWorldPosition(pos.add(move));

        const targetRot = new Quat();
        Quat.fromViewUp(targetRot, dir);

        const currentRot = this.node.worldRotation.clone();
        const smoothRot = new Quat();

        Quat.slerp(smoothRot, currentRot, targetRot, 5 * dt);

        this.node.setWorldRotation(smoothRot);
    }
}