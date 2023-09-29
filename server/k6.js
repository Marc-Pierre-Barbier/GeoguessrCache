import http from 'k6/http';
import {sleep} from 'k6';

export const options = {
	// Key configurations for Stress in this section
	stages: [
		{ duration: '5m', target: 2000 }, // traffic ramp-up from 1 to a higher 200 users over 10 minutes.
		{ duration: '10m', target: 2000 }, // stay at higher 200 users for 30 minutes
		{ duration: '5m', target: 0 }, // ramp-down to 0 users
	],
};

export default () => {
	// each user pull 20 images at once
	for(let i = 0; i < 20; i++)
		http.get(`http://localhost:8080/v1/tile?cb_client=maps_sv.tactile&panoid=V0uPsEbC2Z93U71CKT7RWQ&x=6&y=3&zoom=4&nbt=1&fover=2`);
	//and they do that every second
	sleep(1);
};
