/*
Copyright 2017 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import Resend from './Resend';
import sdk from './index';
import Modal from './Modal';
import { _t } from './languageHandler';

export function getUnknownDevicesForRoom(matrixClient, room) {
    const roomMembers = room.getJoinedMembers().map((m) => {
        return m.userId;
    });
    return matrixClient.downloadKeys(roomMembers, false).then((devices) => {
        const unknownDevices = {};
        // This is all devices in this room, so find the unknown ones.
        Object.keys(devices).forEach((userId) => {
            Object.keys(devices[userId]).map((deviceId) => {
                const device = devices[userId][deviceId];

                if (device.isUnverified() && !device.isKnown()) {
                    if (unknownDevices[userId] === undefined) {
                        unknownDevices[userId] = {};
                    }
                    unknownDevices[userId][deviceId] = device;
                }
            });
        });
        return unknownDevices;
    });
}

export function showUnknownDeviceDialogForMessages(matrixClient, room) {
    getUnknownDevicesForRoom(matrixClient, room).then((unknownDevices) => {
        const onSendAnywayClicked = () => {
            markAllDevicesKnown(matrixClient, unknownDevices);
            Resend.resendUnsentEvents(room);
        };

        const UnknownDeviceDialog = sdk.getComponent('dialogs.UnknownDeviceDialog');
        Modal.createTrackedDialog('Unknown Device Dialog', '', UnknownDeviceDialog, {
            room: room,
            devices: unknownDevices,
            sendAnywayButton:(
                <button onClick={onSendAnywayClicked}>
                    { _t("Send anyway") }
                </button>
            ),
        }, 'mx_Dialog_unknownDevice');
    });
}

function markAllDevicesKnown(matrixClient, devices) {
    Object.keys(devices).forEach((userId) => {
        Object.keys(devices[userId]).map((deviceId) => {
            matrixClient.setDeviceKnown(userId, deviceId, true);
        });
    });
}