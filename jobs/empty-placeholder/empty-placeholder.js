/**
 * Job: empty-placeholder
 *
 * An empty job :)
 *
 */

module.exports = function(config, dependencies, job_callback) {
    job_callback(null, { title: config.title, description: config.description });
};
