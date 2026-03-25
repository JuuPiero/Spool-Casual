import { _decorator, BoxCollider, Component, ITriggerEvent, Node, tween } from 'cc';
import { SlotManager } from './SlotManager';
import { ServiceLocator } from '../ServiceLocator';
import { Wool } from './Wool';
import { Slot } from './Slot';
const { ccclass, property } = _decorator;

@ccclass('MatchZone')
export class MatchZone extends Component {

    private slotManager: SlotManager;

    protected start() {
        this.slotManager = ServiceLocator.get(SlotManager);
    }

    
    protected onLoad(): void {
        let collider = this.getComponent(BoxCollider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    onTriggerEnter(event: ITriggerEvent) {
        const slots = ServiceLocator.get(SlotManager).slots
        const wool = event.otherCollider.getComponent(Wool)
        
        if(wool) {
            console.log(wool.node.name);
        }
        for (const slot of slots) {
            if(slot.spool) {
                if(slot.spool.color.equals(wool.color)) {
                    // sửa thành tween với animation kéo len xuống cuộn len
                    wool.node.setParent(null)
                    wool.node.active = false
                    slot.spool.node.setParent(null)
                    slot.spool.node.active = false
                    slot.spool = null
                    console.log('matched')
                    return
                }
            }
        }
        // const wool = event.otherCollider.getComponent(Wool);
        // if (!wool) return;

        // const slot = this.slotManager.getAvailableSlot();

        // if (!slot || !slot.spool) return;

        // if (slot.spool.color.equals(wool.color)) {

        //     this.handleMatch(wool, slot);
        // }
    }

    private handleMatch(wool: Wool, slot: Slot) {

        // animation về slot
        const target = slot.spool.node.worldPosition;

        tween(wool.node)
            .to(0.3, { worldPosition: target }, { easing: "quadOut" })
            .call(() => {

                wool.node.destroy();

                slot.spool.node.destroy();
                slot.spool = null;

            })
            .start();
    }
}