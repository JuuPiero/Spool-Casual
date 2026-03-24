import { _decorator, Component, ITriggerEvent, Node, SphereCollider } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TestTrigger')
export class TestTrigger extends Component {
    protected onLoad(): void {
        let collider = this.getComponent(SphereCollider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    private onTriggerEnter(event: ITriggerEvent) {
        console.log(event.otherCollider.node.name + " entered trigger");
    }

}


