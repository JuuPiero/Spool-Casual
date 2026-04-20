import { _decorator, Component, director, instantiate, Prefab } from 'cc';
const { ccclass } = _decorator;

@ccclass('GameBehaviour')
export class GameBehaviour extends Component {

    /**
     * @param typeOrMarker Có thể là class Component hoặc marker runtime (string/symbol)
     */
    public getCustomComponent<T extends Component>(typeOrMarker: new (...args: any[]) => T): T | null;
    public getCustomComponent<T>(typeOrMarker: string): T | null;
    public getCustomComponent<T>(typeOrMarker: symbol): T | null;
    public getCustomComponent<T>(typeOrMarker: (new (...args: any[]) => Component) | string | symbol): T | null {
        if (typeof typeOrMarker === 'function') {
            return this.getComponent(typeOrMarker) as unknown as T | null;
        }

        const components = this.getComponents(Component);
        for (const comp of components) {
            if ((comp as any)[typeOrMarker] === true) {
                return comp as unknown as T;
            }
        }

        return null;
    }


    // static Instantiate(obj: Prefab | Node): Node {
    //     const node = instantiate(obj)
    //     const scene = director.getScene();
    //     node.setParent(scene)
    //     return node
    // }

}