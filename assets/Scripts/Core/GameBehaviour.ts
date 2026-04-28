import { _decorator, Component, director, instantiate, Prefab } from 'cc';
const { ccclass } = _decorator;

@ccclass('GameBehaviour')
export class GameBehaviour extends Component {
    public findFirstObjectByType<T extends Component>(typeOrMarker: new (...args: any[]) => T): T | null {
        const components = director.getScene()?.getComponentsInChildren(typeOrMarker as any) || [];
        return components.length > 0 ? components[0].getComponent(typeOrMarker) : null;
    }

    
}