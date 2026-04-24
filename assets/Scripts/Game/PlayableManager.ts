import { _decorator, Component, Node } from 'cc';
import super_html_playable from '../super_html_playable';
const { ccclass, property } = _decorator;

@ccclass('PlayableManager')
export class PlayableManager extends Component {
    
    public static forceInstall() {
        super_html_playable.download()
    }
}


