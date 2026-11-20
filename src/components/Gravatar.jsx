import React from 'react';
import md5 from 'md5';
import { normalizePageUrl } from '../services/api';

const Gravatar = (props) => {
    const email = props.email || '';
    const hash = md5(email.trim().toLowerCase());
    const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon`;
    const customUrl = props.avatarUrl ? normalizePageUrl(props.avatarUrl) : null;

    return (
        <img
            src={customUrl || gravatarUrl}
            alt={props.alt || 'avatar'}
            onError={(e) => {
                if (e.target.src !== gravatarUrl) {
                    e.target.src = gravatarUrl;
                }
            }}
        />
    );
};

export default Gravatar;
