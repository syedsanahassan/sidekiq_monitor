module Sidekiq
  module Monitor
    module Client
      class Middleware
        def initialize(options=nil)
          @processor = Monitor::Processor.new
          @options = options
        end

        def call(worker_class, item, queue, redis_pool=nil)
          ActiveRecord::Base.connection_pool.with_connection do
            @processor.queue(worker_class, item, queue) if @options[:options][:ignore_jobs].exclude?(worker_class.to_s)
            yield
          end
        end
      end
    end
  end
end
