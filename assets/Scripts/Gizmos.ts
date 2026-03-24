import { _decorator, Component, Line, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Gizmos')
export class Gizmos extends Component {

    public static instance: Gizmos;


    private line: Line


    protected onLoad(): void {
        Gizmos.instance = this
        this.line = this.node.getComponent(Line)
    }



    public DrawPath(points: Vec3[]) {
        if (!this.line) return;

        const localPoints = points.map(p => {
            const out = new Vec3();
            this.node.inverseTransformPoint(out, p);
            return out;
        });

        this.line.positions = localPoints;
    }
}


