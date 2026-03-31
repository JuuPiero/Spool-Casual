import { Color } from "cc";


function getRandomColor(): Color {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return new Color(r, g, b, 255); // 255 là alpha (độ đậm)
}


function darkenColor(color, percent) {
    // percent: 0-1, càng lớn càng tối (0: giữ nguyên, 1: đen hoàn toàn)
    let r = color.r * (1 - percent);
    let g = color.g * (1 - percent);
    let b = color.b * (1 - percent);

    return new Color(r, g, b, color.a);
}

export {
    getRandomColor,
    darkenColor,
}


//  public collectOne(item: RaySlot): Promise<void> {
//         return new Promise(resolve => {
//             if (!item.wool) {
//                 resolve();
//                 return;
//             }

//             const start = this.rope.endPoint.worldPosition.clone();
//             const end = item.wool.startPoint.worldPosition.clone();
//             let t = { value: 0 };
//             const lineMesh = this.rope.getComponent(CustomLineMesh);
//             lineMesh.lineWidth = 0.2;

//             tween(t)
//                 .to(0.2, { value: 1 }, {
//                     easing: "quadOut",
//                     onUpdate: () => {
//                         Vec3.lerp(this.tempVec3, start, end, t.value);
//                         this.rope.endPoint.setWorldPosition(this.tempVec3);
//                     },
//                     onComplete: () => {
//                         lineMesh.lineWidth = 0;
//                         this.syncWoolsView();

//                         if (item.wool) {
//                             item.wool.node.active = false;
//                             item.wool = null;
//                         }

//                         this.count = Math.min(this.capacity, this.count + 1);
//                         resolve();
//                     }
//                 })
//                 .start();
//         });
//     }