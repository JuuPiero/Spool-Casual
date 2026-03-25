import { _decorator, Component, Node } from 'cc';
import { StackNavigator } from './StackNavigator';
import { ServiceLocator } from '../ServiceLocator';
const { ccclass, property } = _decorator;

@ccclass('NavigationContainer')
export class NavigationContainer extends Component {
    @property({type : StackNavigator})
    public stack: StackNavigator = null;

    // public tab: tabNavigator = null;

    protected start(): void {
        ServiceLocator.register(NavigationContainer, this);
        this.stack = this.getComponentInChildren(StackNavigator);
    }
}


