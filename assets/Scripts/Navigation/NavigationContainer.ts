import { _decorator, Camera, Component, Node } from 'cc';
import { StackNavigator } from './StackNavigator';
import { ServiceLocator } from '../ServiceLocator';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
const { ccclass, property } = _decorator;

@ccclass('NavigationContainer')
export class NavigationContainer extends Component {
    @property({type : StackNavigator})
    public stack: StackNavigator = null;
    
    private uiCamera: Camera = null;
    protected onLoad(): void {
        this.uiCamera = this.getComponentInChildren(Camera)
    }
    
    
    protected start(): void {
        ServiceLocator.register(NavigationContainer, this);
        this.stack = this.getComponentInChildren(StackNavigator);
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.TOGGLE_VIDEO, this.toggleVideo)
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.TOGGLE_VIDEO, this.toggleVideo)
    }


    toggleVideo = () => {
        this.uiCamera.node.active = !this.uiCamera.node.active
    }
}


